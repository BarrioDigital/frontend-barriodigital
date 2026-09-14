import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "95f77a04-372f-4892-ac61-3645256190af",
    authority: "https://login.microsoftonline.com/b04474a0-e2bf-4a7c-a76b-40b718ef0f12",
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile"],
};