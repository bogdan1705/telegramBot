import { fetch } from "undici";
import { InputFileProxy, ApiResponse, Update } from "@grammyjs/types";
import { State } from "./state";

// Имя бота @JSNinjaDemoStreamBot
const telegramApiKey = "5246438532:AAGnYvf8SK80EIW1oAOhds3ub4tzQumPHEs";

const TELEGRAM_BASE_URL = `https://api.telegram.org/bot${telegramApiKey}`;

type TelegramMethods = InputFileProxy<unknown>["Telegram"];
type TelegramMethodNames = keyof TelegramMethods;
type TelegramMethodReturnType<T extends TelegramMethodNames> = ApiResponse<
  Readonly<ReturnType<TelegramMethods[T]>>
>;
type TelegramMethodParams<T extends TelegramMethodNames> = Parameters<
  TelegramMethods[T]
>[0];

function callTelegramMethod(
  method: "sendMessage",
  payload: TelegramMethodParams<"sendMessage"> & { text: MessageWithState }
): Promise<TelegramMethodReturnType<"sendMessage">>;
function callTelegramMethod<
  T extends Exclude<TelegramMethodNames, "sendMessage">
>(
  method: T,
  payload: TelegramMethodParams<T>
): Promise<TelegramMethodReturnType<T>>;

function callTelegramMethod<T extends TelegramMethodNames>(
  method: T,
  payload: TelegramMethodParams<T>
): Promise<TelegramMethodReturnType<T>> {
  return fetch(`${TELEGRAM_BASE_URL}/${method}`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((r) => r.json() as Promise<TelegramMethodReturnType<T>>);
}

export type HandlerFnReturnType = {
  message: Omit<TelegramMethodParams<"sendMessage">, "chat_id">;
  state: State;
};

type HandlerFn = (
  update: Update,
  state: State
) => {
  message: Omit<TelegramMethodParams<"sendMessage">, "chat_id">;
  state: State;
};

const handlers: Array<HandlerFn> = [];

export function registerHandler(fn: HandlerFn) {
  handlers.push(fn);
}

const SEPARATOR = " ||| ";

type MessageWithState = string & { __brand: MessageWithState };
function augmentTextWithState(text: string, state: State): MessageWithState {
  return `${text}${SEPARATOR}${JSON.stringify(state)}` as MessageWithState;
}

async function processHandler(
  u: Update,
  fn: HandlerFn
): Promise<
  Omit<TelegramMethodParams<"sendMessage">, "chat_id"> & {
    text: MessageWithState;
  }
> {
  if (!u.message?.text) {
    throw new Error("No message");
  }

  const [, previousState] = u.message.text.split(SEPARATOR);
  const state: State = previousState
    ? JSON.parse(previousState)
    : {
        currentScreen: "welcome",
      };

  const result = await fn(u, state);
  return {
    ...result.message,
    text: augmentTextWithState(result.message.text, result.state),
  };
}

export async function run() {
  if (handlers.length === 0) {
    throw new Error("No handlers registered");
  }

  let nextMessageId: number = 0;

  while (1) {
    const response = await callTelegramMethod(
      "getUpdates",
      nextMessageId
        ? {
            offset: nextMessageId,
          }
        : undefined
    );

    if (response.ok) {
      response.result.forEach((u) => {
        if (u.update_id >= nextMessageId) {
          nextMessageId = u.update_id + 1;
        }

        console.log(JSON.stringify(u));

        if (!u.message) {
          return;
        }
        const chatId = u.message.chat.id;

        handlers.forEach(async (handler) => {
          const message = await processHandler(u, handler);

          console.log(message, "SEND");
          await callTelegramMethod("sendMessage", {
            ...message,
            chat_id: chatId,
          });
        });
      });
    } else {
      console.log(response.error_code);
    }
  }
}
