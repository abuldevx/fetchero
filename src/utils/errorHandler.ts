import { IErrors, IExtensions, IMessage } from '../types';

// ---- Utility Functions ----
export const isNotFound = (errors: IErrors[]) =>
  errors[0]?.extensions?.code === '404';

// ---- Formatter Functions ----
const formatErrorCode = ({
  code,
  extensions,
  message,
}: {
  code: string;
  extensions: IExtensions;
  message: IMessage;
}): IErrors => ({
  message,
  extensions: { code, ...extensions },
});

const formatErrorMessage = ({ extensions, message }: IErrors): IErrors => ({
  extensions: { message, ...extensions },
});

const formatErrorResponse = ({ extensions }: IErrors): IErrors => {
  const { code, message = '' } = extensions;

  // Preprocess 422 errors if the message is an object
  let processedMessage = message;
  if (code === '422' && typeof message === 'object' && message !== null) {
    processedMessage = Object.values(message).join(', ');
  }

  const defaultMessages: Record<string, string | IMessage> = {
    401: message,
    404: message,
    500: message,
    422: processedMessage,
    BAD_USER_INPUT: 'Input is not valid',
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
  };

  return {
    extensions: {
      code,
      message: code ? defaultMessages[code] : '',
    },
  };
};

// ---- Compose Utility ----
const compose = (...fns: Array<(error: IErrors) => IErrors>) => (
  error: IErrors
): IErrors => fns.reduce((acc, fn) => fn(acc), error);

// ---- Exported Composed Error Handler ----
export const errorCompose = compose(
  e =>
    formatErrorCode({
      code: e.extensions.code || '',
      extensions: e.extensions,
      message: e.extensions.message || '',
    }),
  e => formatErrorMessage({ ...e, message: e.extensions.message }),
  formatErrorResponse
);

// ---- Helper for creating error responses ----
export const makeErrorResponse = ({
  code,
  message,
}: {
  message: string;
  code: number;
}): IErrors => ({
  message: 'Internal Server Error',
  extensions: {
    message,
    error: true,
    code: String(code),
  },
});
