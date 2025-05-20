import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from 'src/database/prisma.service';
import { Roles } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.get<Roles[]>(ROLES_KEY, context.getHandler()) || [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userCompleted = await this.prismaService.user.findFirstOrThrow({
      where: {
        id: user.id,
      },
      select: {
        role: true,
      },
    });
    console.log(userCompleted.role);

    const userRole = userCompleted.role;
    return requiredRoles.includes(userRole as Roles);
  }
}
