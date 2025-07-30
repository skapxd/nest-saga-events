import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { OrderService } from './order.service';
import { PlaceOrderDto } from './dto/place-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(202) // Accepted
  placeOrder(@Body() placeOrderDto: PlaceOrderDto) {
    // We don't await this. The request finishes immediately,
    // and the saga continues in the background.
    this.orderService.placeOrder(placeOrderDto);
    return { message: 'Order placement process started.' };
  }
}
