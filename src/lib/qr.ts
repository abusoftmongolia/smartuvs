import "server-only";
/** QR кодыг сервер дээр SVG болгоно — qrcode сан client bundle руу орохгүй, гадны сервер рүү URL илгээхгүй */
import QRCode from "qrcode";

export function qrSvg(url: string) {
  return QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });
}
