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
  originalPrice?: number;
  batteryHealth?: number;
}

export function ListingCard({ listingId, brand, model, storage, grade, currentPrice, warrantyMonths, imageUrl, category, originalPrice, batteryHealth }: Props) {
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
        <p className="listing-card-meta">
          {storage}
          {warrantyMonths > 0 && <> · {warrantyMonths}-month warranty</>}
        </p>
        {batteryHealth && batteryHealth > 0 && (
          <p className="listing-card-battery">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-2"/></svg>
            {batteryHealth}% battery
          </p>
        )}
        <div className="listing-card-footer">
          <div className="listing-card-prices">
            <span className="listing-card-price">{formatINR(currentPrice)}</span>
            {originalPrice && originalPrice > currentPrice && (
              <span className="listing-card-original">{formatINR(originalPrice)}</span>
            )}
          </div>
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
        .listing-card-meta {
          margin: 0.125rem 0 0;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .listing-card-battery {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin: 0.375rem 0 0;
          font-size: 0.75rem;
          color: hsl(var(--success));
          background: hsl(var(--success) / 0.08);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-weight: 500;
        }
        .listing-card-footer {
          margin-top: 0.75rem;
        }
        .listing-card-prices {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .listing-card-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        .listing-card-original {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          text-decoration: line-through;
        }
      `}</style>
    </Link>
  );
}
