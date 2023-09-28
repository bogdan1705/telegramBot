type Currency = ("BTC" | "ETH" | "USDT") & { __brand: Currency };

// type Credits = number & { __brand: Credits };

type Transaction = {
  amount: number;
  currency: Currency;
  exchangeRate: number;
};

// interface User {
//   balance: Credits;
// }

type AvailableScreens =
  | "welcome"
  | "currencySelection"
  | "deposit"
  | "amountSelection";

type StateShape<T extends AvailableScreens> = {
  currentScreen: T;
} & Partial<{
  pendingTransaction: Partial<Transaction>;
}>;

interface WelcomeState extends StateShape<"welcome"> {}
interface CurrencySelectionState extends StateShape<"currencySelection"> {}
interface AmountSelectionState extends StateShape<"amountSelection"> {
  pendingTransaction: { currency: Currency };
}
interface DepositState extends StateShape<"deposit"> {
  pendingTransaction: Transaction;
}

export type State =
  | WelcomeState
  | CurrencySelectionState
  | AmountSelectionState
  | DepositState;

type Actions =
  | { type: "BACK" }
  | { type: "GO_TO_CURRENCY_SELECTION" }
  | {
      type: "SELECT_CURRENCY";
      meta: {
        currency: Currency;
      };
    };

function assertExhausted(_: never) {
  throw new Error("Exhaustiveness check failed");
}

export function updateState(state: State, action: Actions): State {
  switch (action.type) {
    case "BACK":
      if (state.currentScreen === "welcome") {
        return state;
      }

      if (state.currentScreen === "currencySelection") {
        return { currentScreen: "welcome" };
      }

      if (state.currentScreen === "deposit") {
        return { ...state, currentScreen: "amountSelection" };
      }

      if (state.currentScreen === "amountSelection") {
        return { currentScreen: "currencySelection" };
      }

      assertExhausted(state);
      return state;

    case "GO_TO_CURRENCY_SELECTION":
      return {
        ...state,
        currentScreen: "currencySelection",
      };
    case "SELECT_CURRENCY":
      return {
        ...state,
        currentScreen: "amountSelection",
        pendingTransaction: {
          currency: action.meta.currency,
        },
      };
    default:
      return state;
  }
}

// ТЕСТЫ
// updateState({ currentScreen: "welcome" }, { type: "GO_TO_CURRENCY_SELECTION" });

// const newState = updateState(
//   { currentScreen: "currencySelection" },
//   {
//     type: "SELECT_CURRENCY",
//     meta: {
//       currency: "BTC" as Currency,
//     },
//   }
// );

// function showUI(state: State): string {
//   if (state.currentScreen === "deposit") {
//     return `Вы собираетесь использовать валюту ${state.pendingTransaction?.currency} для пополнения`;
//   }

//   return "unknown screen";
// }

// declare var s: State;

// if (s.currentScreen === "welcome") {
//   const { currentScreen, ...rest } = s;
// }
