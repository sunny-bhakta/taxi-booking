import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    // console.log(ctx.getContext().req);
    const authorizationHeader = ctx.getContext().req.headers['authorization'];
    console.log(authorizationHeader, ".......authorization header...........");
    console.log("20000000")

    return ctx.getContext().req;
  }
}

