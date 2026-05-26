import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import { firstValueFrom } from "rxjs";

export type NotificationResult = {
  ok: boolean;
  channel: "telegram" | "discord" | "none";
  error?: string;
};

export type NotificationActor = {
  id?: number;
  username?: string;
  email?: string;
  role?: number;
};

export type NotificationContext = {
  title?: string;
  actor?: NotificationActor;
  device?: {
    uid?: string;
    name?: string;
  };
  details?: Array<{label: string; value: string | number | boolean | null | undefined}>;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(NotificationsService.name);

  async send(message: string, context: NotificationContext = {}): Promise<NotificationResult> {
    const telegramToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN");
    const telegramChatId = this.configService.get<string>("TELEGRAM_ADMIN_ID");
    const discordWebhook = this.configService.get<string>(
      "DISCORD_WEBHOOK_URL",
    );

    const formattedMessage = this.formatMessage(message, context);

    if (telegramToken && telegramChatId) {
      return this.sendTelegram(telegramToken, telegramChatId, formattedMessage);
    }

    if (discordWebhook) {
      return this.sendDiscord(discordWebhook, formattedMessage);
    }

    this.logger.warn({
      event: "NOTIFICATION_SKIPPED",
      reason: "No notification channel configured",
    });
    return {
      ok: false,
      channel: "none",
      error: "No notification channel configured",
    };
  }

  private async sendTelegram(
    token: string,
    chatId: string,
    message: string,
  ): Promise<NotificationResult> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          },
          { timeout: 5000 },
        ),
      );
      this.logger.log({
        event: "TELEGRAM_NOTIFICATION_SENT",
        chatId,
      });
      return { ok: true, channel: "telegram" };
    } catch (error) {
      const reason = this.resolveHttpError(error);
      this.logger.error({
        event: "TELEGRAM_NOTIFICATION_FAILED",
        chatId,
        reason,
      });
      return { ok: false, channel: "telegram", error: reason };
    }
  }

  private async sendDiscord(
    webhookUrl: string,
    message: string,
  ): Promise<NotificationResult> {
    try {
      await firstValueFrom(
        this.httpService.post(
          webhookUrl,
          {
            content: message,
          },
          { timeout: 5000 },
        ),
      );
      this.logger.log({ event: "DISCORD_NOTIFICATION_SENT" });
      return { ok: true, channel: "discord" };
    } catch (error) {
      const reason = this.resolveHttpError(error);
      this.logger.error({ event: "DISCORD_NOTIFICATION_FAILED", reason });
      return { ok: false, channel: "discord", error: reason };
    }
  }

  private resolveHttpError(error: unknown) {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as
        | { description?: string; error?: string; message?: string }
        | undefined;
      return (
        responseData?.description ??
        responseData?.error ??
        responseData?.message ??
        error.message
      );
    }

    return error instanceof Error
      ? error.message
      : "Unknown notification error";
  }

  private formatMessage(message: string, context: NotificationContext) {
    const lines: string[] = [];

    if (context.title) {
      lines.push(`<b>${escapeHtml(context.title)}</b>`);
    }

    lines.push(escapeHtml(message));

    if (context.actor) {
      lines.push("");
      lines.push("<b>User</b>");
      lines.push(`• ${escapeHtml(context.actor.username ?? "unknown")}`);
      if (context.actor.id !== undefined) {
        lines.push(`• ID: ${context.actor.id}`);
      }
      if (context.actor.email) {
        lines.push(`• Email: ${escapeHtml(context.actor.email)}`);
      }
      if (context.actor.role !== undefined) {
        lines.push(`• Role: ${context.actor.role}`);
      }
    }

    if (context.device) {
      lines.push("");
      lines.push("<b>Device</b>");
      if (context.device.name) {
        lines.push(`• ${escapeHtml(context.device.name)}`);
      }
      if (context.device.uid) {
        lines.push(`• UID: ${escapeHtml(context.device.uid)}`);
      }
    }

    if (context.details?.length) {
      lines.push("");
      lines.push("<b>Details</b>");
      for (const detail of context.details) {
        lines.push(`• ${escapeHtml(detail.label)}: ${escapeHtml(String(detail.value ?? "-"))}`);
      }
    }

    return lines.join("\n");
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
