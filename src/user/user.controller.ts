// src/user/user.controller.ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(202) // Accepted
  createUser(@Body() createUserDto: CreateUserDto) {
    // We don't await this, the request finishes and the saga continues in the background
    this.userService.createUser(createUserDto);
    return { message: 'User creation process started.' };
  }
}
