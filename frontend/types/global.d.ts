declare global {
  var tokenBlacklist: Set<string>;
  
  namespace NodeJS {
    interface Global {
      tokenBlacklist: Set<string>;
    }
  }
}

export {};
