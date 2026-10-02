import { Module } from "@nestjs/common";
import { ORPCError, ORPCModule } from "@orpc/nest";
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from "@orpc/server/plugins";

@Module({
  imports: [
    ORPCModule.forRoot({
      plugins: [new RethrowHandlerPlugin({ filter: (error) => !(error instanceof ORPCError) })],
    }),
  ],
})
export class AppOrpcModule {}
