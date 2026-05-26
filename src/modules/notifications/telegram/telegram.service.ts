// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { InjectBot } from 'nestjs-telegraf';
// import { Context, Telegraf } from 'telegraf';

// @Injectable()
// export class TelegramNotificationService {
//     // Инициализируем логгер контекстом текущего класса
//     private readonly logger = new Logger(TelegramNotificationService.name);
//     private readonly adminId: string;

//     constructor(
//         @InjectBot() private readonly bot: Telegraf<Context>,
//         private readonly configService: ConfigService,
//     ) {
//         this.adminId = this.configService.get<string>('TELEGRAM_ADMIN_ID')!;
//     }

//     /**
//      * Отправка важного уведомления администратору (вам).
//      * Использует HTML-парсинг для красивого форматирования.
//      */
//     async sendAdminNotification(message: string): Promise<void> {
//         try {
//             await this.bot.telegram.sendMessage(this.adminId, message, {
//                 parse_mode: 'Markdown', // Позволяет использовать <b>bold</b>, <code>code</code>
//             });
//             this.logger.log(`Notification sent to admin: ${this.adminId}`);
//         } catch (error) {
//             this.logger.error(`Failed to send telegram notification: ${error.message}`, error.stack);
//             // В реальном проекте здесь можно добавить retry-логику или сохранение в очередь
//         }
//     }

//     /**
//      * Пример отправки сообщения с ошибкой (для алертинга)
//      */
//     async sendErrorAlert(context: string, errorDetails: string): Promise<void> {
//         const message = `
// 🚨 <b>CRITICAL ERROR</b> 🚨
// <b>Context:</b> ${context}
// <b>Details:</b>
// <pre>${errorDetails}</pre>
//     `;
//         await this.sendAdminNotification(message);
//     }
// }
