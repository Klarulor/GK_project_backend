import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";
import {
  ElectricityCountry,
  EleringCurrentResponse,
  EleringPricePoint,
  EleringRangeResponse,
} from "src/common/types/electricity-price.types";
import { ElectricityPrice } from "src/common/types/electricity-price.types";
import { PricePoint } from "src/database/entities/PricePoint";
import { Repository } from "typeorm/repository/Repository.js";
import { DateTime } from "luxon";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class ElectricityService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(PricePoint)
    private readonly pricePointRepository: Repository<PricePoint>,
    private readonly httpService: HttpService,
  ) {}
  private readonly logger = new Logger(ElectricityService.name);

  private readonly baseUrl = "https://dashboard.elering.ee/api/nps/price";
  private readonly timezone = "Europe/Tallinn";
  private readonly slowResponseThresholdMs = 2500;
  private readonly highPriceWarningEurMwh = 200;

  private currentPriceCache: Record<
    ElectricityCountry,
    ElectricityPrice | null
  > = {
    ee: null,
    lv: null,
    lt: null,
    fi: null,
  };

  onApplicationBootstrap() {
    this.logger.log({
      event: "AUTOMATION_RUN_STARTED",
      message: "Automation cycle started",
    });
    ["ee", "lv", "lt", "fi"].forEach((country) => {
      void this.updateCurrentPrice(country as ElectricityCountry);
    });
  }

  @Cron("0 * * * *")
  updatePrices() {
    ["ee", "lv", "lt", "fi"].forEach((country) => {
      void this.updateCurrentPrice(country as ElectricityCountry);
    });
  }

  async updateCurrentPrice(country: ElectricityCountry) {
    try {
      const data = await this.fetchCurrentPrice(country);
      this.currentPriceCache[country] = data;

      const target = await this.pricePointRepository.findOneBy({
        location: country,
        timestamp: new Date(data.timestamp * 1000),
      });
      if (!target) {
        const newPoint = new PricePoint();
        newPoint.location = country;
        newPoint.timestamp = new Date(data.timestamp * 1000);
        newPoint.priceEurMwh = data.priceEurMwh;
        await this.pricePointRepository.save(newPoint);
      }
    } catch {
      this.logger.error({
        event: "ELERING_CURRENT_TIMEOUT",
        country,
        fallback: this.currentPriceCache[country] ? "cache" : "database",
      });
    }
  }

  async fetchCurrentPrice(
    country: ElectricityCountry = "ee",
  ): Promise<ElectricityPrice> {
    const url = `${this.baseUrl}/${country.toUpperCase()}/current`;
    const startedAt = Date.now();
    try {
      const response = await firstValueFrom(
        this.httpService.get<EleringCurrentResponse>(url, {
          timeout: 10_000,
        }),
      );

      const point = response.data.data?.[0];
      if (!point) {
        throw new ServiceUnavailableException("Elering returned empty data");
      }

      this.logEleringResponse(country, point.price, Date.now() - startedAt);
      return this.normalizePricePoint(point, country);
    } catch {
      this.logger.error({
        event: "ELERING_CURRENT_TIMEOUT",
        country,
        url,
      });
      throw new ServiceUnavailableException(
        "Could not fetch current electricity price",
      );
    }
  }
  async fetchPriceRange(
    country: ElectricityCountry = "ee",
    start: Date,
    end: Date,
  ): Promise<ElectricityPrice[]> {
    const url = `${this.baseUrl}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
    const startedAt = Date.now();
    try {
      const response = await firstValueFrom(
        this.httpService.get<EleringRangeResponse>(url, {
          timeout: 10_000,
        }),
      );

      const points = response.data.data?.[country] ?? [];
      const durationMs = Date.now() - startedAt;
      if (durationMs > this.slowResponseThresholdMs) {
        this.logger.warn({
          event: "ELERING_SLOW_RESPONSE",
          country,
          durationMs,
          url,
        });
      }
      points.forEach((point) =>
        this.logElectricityPriceAnomalies(country, point.price),
      );
      return points.map((point) => this.normalizePricePoint(point, country));
    } catch {
      this.logger.error({
        event: "ELERING_RANGE_TIMEOUT",
        country,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      return this.getStoredRange(country, start, end);
    }
  }

  async getForecast(
    country: ElectricityCountry = "ee",
  ): Promise<ElectricityPrice[]> {
    const start = new Date();
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return this.fetchPriceRange(country, start, end);
  }

  async getStoredRange(
    country: ElectricityCountry,
    start: Date,
    end: Date,
  ): Promise<ElectricityPrice[]> {
    const rows = await this.pricePointRepository
      .createQueryBuilder("price")
      .where("price.location = :country", { country })
      .andWhere("price.timestamp >= :start", { start })
      .andWhere("price.timestamp <= :end", { end })
      .orderBy("price.timestamp", "ASC")
      .getMany();

    return rows.map((row) =>
      this.normalizePricePoint(
        {
          timestamp: Math.floor(row.timestamp.getTime() / 1000),
          price: row.priceEurMwh,
        },
        country,
      ),
    );
  }

  private normalizePricePoint(
    point: EleringPricePoint,
    country: ElectricityCountry,
  ): ElectricityPrice {
    const utcDate = DateTime.fromSeconds(point.timestamp, {
      zone: "utc",
    });

    return {
      country,
      timestamp: point.timestamp,
      utcTime: utcDate.toISO()!,
      localTime: utcDate.setZone(this.timezone).toISO()!,
      priceEurMwh: this.round(point.price, 3),
      priceEurKwh: this.round(point.price / 1000, 6),
    };
  }
  private round = (value: number, digits: number) =>
    Number(value.toFixed(digits));

  private logEleringResponse(
    country: ElectricityCountry,
    priceEurMwh: number,
    durationMs: number,
  ) {
    if (durationMs > this.slowResponseThresholdMs) {
      this.logger.warn({
        event: "ELERING_SLOW_RESPONSE",
        country,
        durationMs,
      });
    }

    this.logElectricityPriceAnomalies(country, priceEurMwh);
  }

  private logElectricityPriceAnomalies(
    country: ElectricityCountry,
    priceEurMwh: number,
  ) {
    if (priceEurMwh < 0) {
      this.logger.error({
        event: "NEGATIVE_ELECTRICITY_PRICE",
        country,
        priceEurMwh,
      });
      return;
    }

    if (priceEurMwh >= this.highPriceWarningEurMwh) {
      this.logger.warn({
        event: "HIGH_ELECTRICITY_PRICE",
        country,
        priceEurMwh,
      });
    }
  }

  async getCurrentPrice(
    country: ElectricityCountry,
  ): Promise<ElectricityPrice> {
    const cached = this.currentPriceCache[country];
    if (cached) return cached;

    try {
      const price = await this.fetchCurrentPrice(country);
      this.currentPriceCache[country] = price;
      return price;
    } catch {
      const stored = await this.getLatestStoredPrice(country);
      if (stored) {
        this.currentPriceCache[country] = stored;
        return stored;
      }
      throw new ServiceUnavailableException(
        "Could not fetch current electricity price and no fallback exists",
      );
    }
  }

  private async getLatestStoredPrice(
    country: ElectricityCountry,
  ): Promise<ElectricityPrice | null> {
    const row = await this.pricePointRepository.findOne({
      where: { location: country },
      order: { timestamp: "DESC" },
    });
    if (!row) return null;
    return this.normalizePricePoint(
      {
        timestamp: Math.floor(row.timestamp.getTime() / 1000),
        price: row.priceEurMwh,
      },
      country,
    );
  }
}
