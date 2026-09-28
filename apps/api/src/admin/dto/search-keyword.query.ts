import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class SearchKeywordQuery {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  keyword: string;
}
