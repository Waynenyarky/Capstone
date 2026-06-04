const {
  generateCode,
  generateToken,
} = require("../../../services/auth-service/src/lib/codes");

describe("Auth Service - Codes Library", () => {
  describe("generateCode", () => {
    it("should generate a 6-digit numeric code", () => {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it("should generate different codes on multiple calls", () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateCode());
      }
      // With 6 digits, there are 900,000 possible codes
      // 100 calls should almost certainly produce different codes
      expect(codes.size).toBeGreaterThan(50);
    });

    it("should generate codes within valid range (100000-999999)", () => {
      const code = parseInt(generateCode(), 10);
      expect(code).toBeGreaterThanOrEqual(100000);
      expect(code).toBeLessThanOrEqual(999999);
    });
  });

  describe("generateToken", () => {
    it("should generate a hex string", () => {
      const token = generateToken();
      expect(token).toMatch(/^[a-f0-9]+$/i);
    });

    it("should generate a 48-character hex string (24 bytes)", () => {
      const token = generateToken();
      expect(token.length).toBe(48);
    });

    it("should generate different tokens on multiple calls", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      // With 24 bytes of randomness, collisions are extremely unlikely
      expect(tokens.size).toBe(100);
    });
  });
});
