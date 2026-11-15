import Image from "next/image";

type DecorativePhotoProps = {
  number: number;
  className: string;
  sizes?: string;
  eager?: boolean;
};

export function DecorativePhoto({ number, className, sizes = "220px", eager = false }: DecorativePhotoProps) {
  return <span className={`floating-photo ${className}`} aria-hidden="true">
    <Image
      src={`/suspects/suspect-${String(number).padStart(2, "0")}.png`}
      alt=""
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
    />
  </span>;
}
