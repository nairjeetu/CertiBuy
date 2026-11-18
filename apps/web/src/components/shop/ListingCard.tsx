"use client";

import Link from "next/link";
import { GradeChip } from "../ui/GradeChip";
import { formatINR } from "@/lib/format";
import { DeviceImage } from "./DeviceImage";

interface Props {
  listingId: string;
  brand: string;
  model: string;
  storage: string;
  grade: string;
  currentPrice: number;
  warrantyMonths: number;
  imageUrl?: string;
  category?: string;
}

export function ListingCard({ listingId, brand, model, storage, grade, currentPrice, warrantyMonths, imageUrl, category }: Props) {
  return (
    <Link href={`/shop/${listingId}`} className="listing-card surface">
      <div className="listing-card-image">
        <DeviceImage imageUrl={imageUrl} brand={brand} model={model} category={category} />
        <div className="listing-card-grade">
          <GradeChip grade={grade} />
        </div>
      </div>
      <div className="listing-card-body">
        <p className="listing-card-title">{brand} {model}</p>
        <p className="listing-card-storage">{storage}</p>
        <div className="listing-card-footer">
          <span className="listing-card-price">{formatINR(currentPrice)}</span>
          {warrantyMonths > 0 && (
            <span className="listing-card-warranty">{warrantyMonths} mo</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .listing-card {
          display: block;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .listing-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .listing-card-image {
          position: relative;
          background: hsl(var(--background));
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
        }
        .listing-card-grade {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
        }
        .listing-card-body {
          padding: 0.875rem 1rem 1rem;
        }
        .listing-card-title {
          margin: 0;
          font-weight: 600;
          font-size: 0.9375rem;
          line-height: 1.3;
          color: hsl(var(--foreground));
        }
        .listing-card-storage {
          margin: 0.125rem 0 0;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .listing-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: 0.75rem;
        }
        .listing-card-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        .listing-card-warranty {
          font-size: 0.6875rem;
          color: hsl(var(--success));
          background: hsl(var(--success) / 0.1);
          padding: 0.125rem 0.5rem;
          border-radius: 100px;
          font-weight: 500;
        }
      `}</style>
    </Link>
  );
}
