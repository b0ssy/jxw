import { AuthController } from "./auth";
import { ChatController } from "./chat";
import { Controller } from "../data/api";

export class Controllers extends Controller {
  auth() {
    new AuthController({ ctl: this });
  }

  chat() {
    new ChatController({ ctl: this });
  }
}

export const ctl = new Controllers();
