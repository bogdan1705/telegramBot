import { HandlerFnReturnType, registerHandler, run } from "./services/telegram";
import { updateState, State } from "./services/state";

registerHandler((u, state): HandlerFnReturnType => {
  if (!u.message) {
    throw new Error("test");
  }

  console.log(JSON.stringify(u));
  let newState: State = state;
  if (u.message.text === "/balance") {
    newState = updateState(state, { type: "GO_TO_CURRENCY_SELECTION" });
  }

  if (newState.currentScreen === "currencySelection") {
    return {
      state: newState,
      message: { text: "Выбор валюты" },
    };
  }

  return {
    state: newState,
    message: {
      text: "Основной экран",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Пополнить баланс",
              callback_data: "test",
            },
          ],
        ],
      },
    },
  };
});

run();
