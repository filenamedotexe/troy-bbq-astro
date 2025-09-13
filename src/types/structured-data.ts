// Schema.org structured data types for Troy BBQ

export interface Thing {
  "@context"?: string;
  "@type": string;
  "@id"?: string;
  name?: string;
  description?: string;
  url?: string;
  image?: string | ImageObject | ImageObject[];
  sameAs?: string[];
}

export interface ImageObject extends Thing {
  "@type": "ImageObject";
  contentUrl?: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface PostalAddress extends Thing {
  "@type": "PostalAddress";
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export interface GeoCoordinates extends Thing {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
}

export interface ContactPoint extends Thing {
  "@type": "ContactPoint";
  telephone?: string;
  email?: string;
  contactType?: string;
  availableLanguage?: string | string[];
}

export interface Person extends Thing {
  "@type": "Person";
  givenName?: string;
  familyName?: string;
  jobTitle?: string;
}

export interface Organization extends Thing {
  "@type": "Organization";
  alternateName?: string;
  legalName?: string;
  foundingDate?: string;
  founders?: Person[];
  logo?: string | ImageObject;
  contactPoint?: ContactPoint | ContactPoint[];
  address?: PostalAddress;
  telephone?: string;
  email?: string;
  parentOrganization?: Organization;
  subOrganization?: Organization[];
}

export interface OpeningHoursSpecification extends Thing {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string | string[];
  opens: string;
  closes: string;
  validFrom?: string;
  validThrough?: string;
}

export interface Rating extends Thing {
  "@type": "Rating";
  ratingValue: string | number;
  bestRating?: string | number;
  worstRating?: string | number;
}

export interface AggregateRating extends Rating {
  "@type": "AggregateRating";
  reviewCount: string | number;
}

export interface Review extends Thing {
  "@type": "Review";
  author: Person | Organization;
  reviewRating: Rating;
  reviewBody: string;
  datePublished?: string;
}

export interface LocationFeatureSpecification extends Thing {
  "@type": "LocationFeatureSpecification";
  name: string;
  value: boolean | string | number;
}

export interface LocalBusiness extends Organization {
  "@type": "LocalBusiness" | ["LocalBusiness", string] | string[];
  address: PostalAddress;
  geo?: GeoCoordinates;
  telephone: string;
  openingHoursSpecification?: OpeningHoursSpecification[];
  priceRange?: string;
  paymentAccepted?: string[];
  currenciesAccepted?: string;
  amenityFeature?: LocationFeatureSpecification[];
  aggregateRating?: AggregateRating;
  review?: Review[];
}

export interface FoodEstablishment extends LocalBusiness {
  "@type": "FoodEstablishment" | ["FoodEstablishment", string] | string[];
  servesCuisine?: string | string[];
  hasMenu?: string;
  acceptsReservations?: boolean;
}

export interface Restaurant extends FoodEstablishment {
  "@type": "Restaurant" | ["Restaurant", string] | string[];
}

export interface Offer extends Thing {
  "@type": "Offer";
  price: string | number;
  priceCurrency: string;
  availability?: string;
  validFrom?: string;
  validThrough?: string;
  seller?: Organization;
  itemCondition?: string;
}

export interface Brand extends Thing {
  "@type": "Brand";
}

export interface Product extends Thing {
  "@type": "Product";
  brand?: Brand;
  sku?: string;
  gtin?: string;
  category?: string;
  offers?: Offer | Offer[];
  aggregateRating?: AggregateRating;
  review?: Review[];
}

export interface MenuItem extends Product {
  "@type": "MenuItem";
  nutrition?: NutritionInformation;
  suitableForDiet?: string[];
}

export interface NutritionInformation extends Thing {
  "@type": "NutritionInformation";
  calories?: string;
  carbohydrateContent?: string;
  proteinContent?: string;
  fatContent?: string;
  sodiumContent?: string;
}

export interface MenuSection extends Thing {
  "@type": "MenuSection";
  hasMenuItem?: MenuItem[];
  hasMenuSection?: MenuSection[];
}

export interface Menu extends Thing {
  "@type": "Menu";
  hasMenuSection?: MenuSection[];
  hasMenuItem?: MenuItem[];
}

export interface ListItem extends Thing {
  "@type": "ListItem";
  position: number;
  item?: string | Thing;
}

export interface BreadcrumbList extends Thing {
  "@type": "BreadcrumbList";
  itemListElement: ListItem[];
}

export interface WebSite extends Thing {
  "@type": "WebSite";
  potentialAction?: SearchAction;
  publisher?: Organization;
}

export interface SearchAction extends Thing {
  "@type": "SearchAction";
  target: string;
  "query-input": string;
}

export interface Event extends Thing {
  "@type": "Event";
  startDate: string;
  endDate?: string;
  location: PostalAddress | string;
  organizer?: Organization | Person;
  offers?: Offer[];
  performer?: Organization | Person;
}