import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserEntity } from "src/database/entities/UserEntity";

type RequestWithUser = {
  user?: UserEntity;
};

export const User = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user as UserEntity;

    if (!user) {
      return null;
    }
    if (data) {
      return user[data];
    }
    return user;
  },
);
