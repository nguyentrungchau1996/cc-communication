import { v4 as uuidv4 } from "uuid";

export const serviceIframe = (global: Window) => {
  const model = {
    listen: (dataReq: any, dataSent?: any) => {
      return new Promise((resolve, reject) => {
        let message;

        if (dataSent.error) message = { id: dataReq.id, error: { ...dataSent.err } };
        else message = { ...dataReq, data: { ...dataReq.data, ...dataSent } };

        global.parent.postMessage(message, "*");
        return resolve(message);
      });
    },

    request: (endpoint: string, data: any, iframe: HTMLIFrameElement, timeout: number = 3000) => {
      const messageId = uuidv4();

      return new Promise((resolve, reject) => {
        const tempTarget = iframe.getAttribute("src") || "";
        const target = tempTarget.split("?")[0] || "";

        if (target && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ id: messageId, endpoint, data }, target);

          if (timeout) {
            global.setTimeout(() => {
              return reject(new Error(`Request timeout!`));
            }, timeout);
          }

          let handler = (e: MessageEvent) => {
            const payload = e.data;

            if (payload.id && payload.id === messageId) {
              if (payload.error) {
                global.removeEventListener("message", handler, false);

                return reject(new Error(`Request failed with ${payload.error}`));
              }

              global.removeEventListener("message", handler, false);

              return resolve(payload.data);
            }
          };
          global.addEventListener("message", handler);
        }
      });
    },
  };

  return model;
};
