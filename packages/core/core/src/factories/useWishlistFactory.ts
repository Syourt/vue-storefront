import { UseWishlist, CustomQuery, Context, FactoryParams } from '../types';
import { Ref, computed } from '@vue/composition-api';
import { sharedRef, Logger, generateContext } from '../utils';

export interface UseWishlistFactoryParams<WISHLIST, WISHLIST_ITEM, PRODUCT> extends FactoryParams {
  load: (context: Context, customQuery?: CustomQuery) => Promise<WISHLIST>;
  addItem: (
    context: Context,
    params: {
      currentWishlist: WISHLIST;
      product: PRODUCT;
      customQuery?: CustomQuery;
    }) => Promise<WISHLIST>;
  removeItem: (
    context: Context,
    params: {
      currentWishlist: WISHLIST;
      product: WISHLIST_ITEM;
      customQuery?: CustomQuery;
    }) => Promise<WISHLIST>;
  clear: (context: Context, params: { currentWishlist: WISHLIST }) => Promise<WISHLIST>;
  isOnWishlist: (context: Context, params: { currentWishlist: WISHLIST; product: PRODUCT }) => boolean;
}

interface UseWishlistFactory<WISHLIST, WISHLIST_ITEM, PRODUCT> {
  useWishlist: () => UseWishlist<WISHLIST, WISHLIST_ITEM, PRODUCT>;
  setWishlist: (wishlist: WISHLIST) => void;
}

export const useWishlistFactory = <WISHLIST, WISHLIST_ITEM, PRODUCT>(
  factoryParams: UseWishlistFactoryParams<WISHLIST, WISHLIST_ITEM, PRODUCT>
): UseWishlistFactory<WISHLIST, WISHLIST_ITEM, PRODUCT> => {
  const setWishlist = (newWishlist: WISHLIST) => {
    sharedRef('useWishlist-wishlist').value = newWishlist;
    Logger.debug('useWishlistFactory.setWishlist', newWishlist);
  };

  const useWishlist = (): UseWishlist<WISHLIST, WISHLIST_ITEM, PRODUCT> => {
    const loading: Ref<boolean> = sharedRef<boolean>(false, 'useWishlist-loading');
    const wishlist: Ref<WISHLIST> = sharedRef(null, 'useWishlist-wishlist');
    const context = generateContext(factoryParams);

    const addItem = async (product: PRODUCT, customQuery?: CustomQuery) => {
      Logger.debug('useWishlist.addToWishlist', product);

      loading.value = true;
      const updatedWishlist = await factoryParams.addItem(
        context,
        {
          currentWishlist: wishlist.value,
          product,
          customQuery
        }
      );
      wishlist.value = updatedWishlist;
      loading.value = false;
    };

    const removeItem = async (product: WISHLIST_ITEM, customQuery?: CustomQuery) => {
      Logger.debug('useWishlist.removeFromWishlist', product);

      loading.value = true;
      const updatedWishlist = await factoryParams.removeItem(
        context,
        {
          currentWishlist: wishlist.value,
          product,
          customQuery
        }
      );
      wishlist.value = updatedWishlist;
      loading.value = false;
    };

    const load = async (customQuery?: CustomQuery) => {
      Logger.debug('useWishlist.load');

      if (wishlist.value) return;

      loading.value = true;
      wishlist.value = await factoryParams.load(context, customQuery);
      loading.value = false;
    };

    const clear = async () => {
      Logger.debug('useWishlist.clearWishlist');

      loading.value = true;
      const updatedWishlist = await factoryParams.clear(context, {
        currentWishlist: wishlist.value
      });
      wishlist.value = updatedWishlist;
      loading.value = false;
    };

    const isOnWishlist = (product: PRODUCT) => {
      Logger.debug('useWishlist.isOnWishlist', product);

      return factoryParams.isOnWishlist(context, {
        currentWishlist: wishlist.value,
        product
      });
    };

    return {
      wishlist: computed(() => wishlist.value),
      isOnWishlist,
      addItem,
      load,
      removeItem,
      clear,
      loading: computed(() => loading.value)
    };
  };

  return { useWishlist, setWishlist };
};

