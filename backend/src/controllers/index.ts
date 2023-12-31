import { AuthController } from "./auth";
import { ChatController } from "./chat";
import { Controller } from "../data/api";

// Quick access to all controllers
export class Controllers extends Controller {
  get auth() {
    return new AuthController({ ctl: this });
  }

  get chat() {
    return new ChatController({ ctl: this });
  }
}

export const ctl = new Controllers();
