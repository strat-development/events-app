
import { useMutation, useQuery } from "react-query";
import { getStripeProduct } from "@/fetchers/payments/getStripeProduct";
import { createStripeProduct as createStripeProductFetcher } from "@/fetchers/payments/createStripeProduct";

interface CreateProductData {
  eventId: string;
  name: string;
  description: string;
  price: number;
  metadata: Record<string, string>;
  stripeAccountId: string;
}

export const useStripeProducts = () => {
  const getProductByEventId = (eventId: string) => 
    useQuery(['stripe-product', eventId], () => getStripeProduct(eventId));

  const createProduct = useMutation((productData: CreateProductData) => 
    createStripeProductFetcher(productData)
  );

  return { createProduct, getProductByEventId };
};