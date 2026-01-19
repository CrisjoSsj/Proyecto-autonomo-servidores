import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  providers: [WebSocketService, WebSocketGateway],
  exports: [WebSocketService],
})
export class WebSocketModule {}
