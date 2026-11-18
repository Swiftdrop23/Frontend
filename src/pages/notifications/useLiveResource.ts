import { useEffect, useState } from "react";
import { isMock } from "../../api/http";
import { errMessage } from "../../utils/errors";

export function useLiveResource<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (isMock) return;
    let active = true;
    load().then(
      (data) => { if (active) setState({ data }); },
      (error: unknown) => { if (active) setState({ error: errMessage(error) }); },
    );
    return () => { active = false; };
  }, [load]);

  async function run(action: () => Promise<unknown>, message: string, refresh = true) {
    setBusy(true);
    setNotice("");
    try {
      await action();
      setNotice(message);
      if (refresh) setState({ data: await load() });
    } catch (error) {
      setNotice(errMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const error = isMock ? "Set VITE_API_URL to connect to the SwiftDrop backend." : state.error;
  return { ...state, error, busy, notice, run };
}
