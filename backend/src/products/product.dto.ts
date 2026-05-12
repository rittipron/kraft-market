import {
  IsString, IsNumber, IsOptional, IsArray, IsEnum,
  Min, MinLength, MaxLength, IsMongoId, IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(200)
  name: string;

  @IsNumber() @Min(0)
  price: number;

  @IsOptional() @IsString() @MaxLength(50)
  sku?: string;

  @IsOptional() @IsNumber() @Min(0)
  stock?: number;

  @IsOptional() @IsMongoId()
  categoryId?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true })
  images?: string[];

  @IsOptional() @IsEnum(['active', 'draft', 'archived'])
  status?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200)
  name?: string;

  @IsOptional() @IsNumber() @Min(0)
  price?: number;

  @IsOptional() @IsNumber() @Min(0)
  stock?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true })
  images?: string[];

  @IsOptional() @IsEnum(['active', 'draft', 'archived'])
  status?: string;
}

export class ProductQueryDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsMongoId()
  categoryId?: string;

  @IsOptional() @IsEnum(['active', 'draft', 'archived'])
  status?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  limit?: number = 20;
}
