import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpClientModule } from "@nestjs/http-client";
import { AddressLookupController } from "@/admin/address-lookup/address-lookup.controller";
import { AddressLookupService } from "@/admin/address-lookup/address-lookup.service";
import { AddressSearchController } from "@/admin/address-search/address-search.controller";
import { AddressSearchService, JUSO_CLIENT } from "@/admin/address-search/address-search.service";
import { KAKAO_LOCAL_CLIENT, PlaceSearchService } from "@/admin/place-search/place-search.service";
import { RestaurantSearchController } from "@/admin/restaurant-search/restaurant-search.controller";
import { RestaurantSearchService } from "@/admin/restaurant-search/restaurant-search.service";
import type { Env } from "@/_common/types/env";

@Module({
  imports: [
    HttpClientModule.registerAsync({
      name: KAKAO_LOCAL_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        baseUrl: "https://dapi.kakao.com",
        headers: { authorization: `KakaoAK ${config.get("KAKAO_REST_API_KEY", { infer: true })}` },
      }),
    }),
    HttpClientModule.register({
      name: JUSO_CLIENT,
      baseUrl: "https://business.juso.go.kr",
    }),
  ],
  controllers: [AddressSearchController, AddressLookupController, RestaurantSearchController],
  providers: [
    AddressSearchService,
    AddressLookupService,
    PlaceSearchService,
    RestaurantSearchService,
  ],
})
export class AdminModule {}
