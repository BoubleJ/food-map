import { IsIn, Matches } from "class-validator";

export class AddressCoordinateQuery {
  @Matches(/^\d{10}$/)
  admCd: string;

  @Matches(/^\d{12}$/)
  rnMgtSn: string;

  @IsIn(["0", "1"])
  udrtYn: string;

  @Matches(/^\d{1,5}$/)
  buldMnnm: string;

  @Matches(/^\d{1,5}$/)
  buldSlno: string;
}
