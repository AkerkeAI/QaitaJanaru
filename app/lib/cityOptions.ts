import { Messages } from "@/app/types/messages";

export interface CityOption {
  value: string;
  label: string;
}

export function getCityOptions(messages: Messages): CityOption[] {
  return [
    { value: "astana", label: messages.cities.astana },
    { value: "almaty", label: messages.cities.almaty },
    { value: "shymkent", label: messages.cities.shymkent },
    { value: "aktobe", label: messages.cities.aktobe },
    { value: "atyrau", label: messages.cities.atyrau },
    { value: "aktau", label: messages.cities.aktau },
    { value: "karaganda", label: messages.cities.karaganda },
    { value: "kostanay", label: messages.cities.kostanay },
    { value: "kokshetau", label: messages.cities.kokshetau },
    { value: "kyzylorda", label: messages.cities.kyzylorda },
    { value: "pavlodar", label: messages.cities.pavlodar },
    { value: "petropavl", label: messages.cities.petropavl },
    { value: "semey", label: messages.cities.semey },
    { value: "taraz", label: messages.cities.taraz },
    { value: "taldykorgan", label: messages.cities.taldykorgan },
    { value: "turkistan", label: messages.cities.turkistan },
    { value: "uralsk", label: messages.cities.uralsk },
    { value: "ust-kamenogorsk", label: messages.cities["ust-kamenogorsk"] },
    { value: "zhezkazgan", label: messages.cities.zhezkazgan },
  ];
}

export function getCityLabel(
  cityValue: string | undefined | null,
  messages: Messages,
): string {
  if (!cityValue) {
    return messages.common.unknown;
  }

  const normalized = cityValue.trim().toLowerCase();
  const match = getCityOptions(messages).find(
    (option) => option.value === normalized,
  );

  return match?.label || cityValue;
}
