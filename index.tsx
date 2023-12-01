// Assuming this code is in a file like ExternalComponentSetup.js
import { createRoot } from "react-dom/client";
import SitecoreAssetsSearch from "./SitecoreAssetsSearch";
import { BaseContext } from "../../utils/utils";

interface Context extends BaseContext {
  config: {
    searchIdentifier: string;
  }
}

export default function createExternalRoot(container: HTMLElement) {
  let root = createRoot(container);
  return {
    render(context: Context) {
      root.render(<SitecoreAssetsSearch context={context} />);
    },

    unmount() {
      root.unmount();
    },
  };
}
