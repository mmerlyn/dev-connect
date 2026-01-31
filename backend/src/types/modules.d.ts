declare module 'speakeasy' {
  interface GenerateSecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
  }

  interface TOTPVerifyOptions {
    secret: string;
    encoding?: 'ascii' | 'hex' | 'base32';
    token: string;
    window?: number;
  }

  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
  export const totp: {
    verify(options: TOTPVerifyOptions): boolean;
  };
}

declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>;
}
