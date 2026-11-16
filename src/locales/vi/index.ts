import { common } from './common';
import { navigation } from './navigation';
import { home } from './home';
import { story } from './story';
import { products } from './products';
import { gifting } from './gifting';
import { cartCheckout } from './cartCheckout';
import { authAccount } from './authAccount';
import { assistant } from './assistant';

export const viResources = {
  common,
  navigation,
  home,
  story,
  products,
  gifting,
  cartCheckout,
  authAccount,
  assistant,
} as const;

export type LocaleResources = typeof viResources;
