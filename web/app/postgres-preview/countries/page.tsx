import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CountriesRedirectSearchParams = Record<
  string,
  string | string[] | undefined
>;

function toMarketsHref(searchParams: CountriesRedirectSearchParams) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          params.append(key, entry);
        }
      });
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query
    ? `/postgres-preview/markets?${query}`
    : "/postgres-preview/markets";
}

export default async function PostgresCountriesRedirect({
  searchParams,
}: {
  searchParams?: Promise<CountriesRedirectSearchParams>;
}) {
  redirect(toMarketsHref(searchParams ? await searchParams : {}));
}
