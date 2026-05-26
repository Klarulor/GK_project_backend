import { SetMetadata } from "@nestjs/common";

export const AUTH_ONLY_KEY = "authorization";
export const Authorize = () => SetMetadata(AUTH_ONLY_KEY, true);
