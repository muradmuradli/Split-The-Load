import type { Metadata } from "next";

import { NewFlatForm } from "./new-flat-form";

export const metadata: Metadata = {
  title: "Create a flat — Split the Load",
  description:
    "Set up a new flat or team, name it, and invite housemates by email so effort can be split fairly.",
  openGraph: {
    title: "Create a flat — Split the Load",
    description: "Name your flat and invite housemates by email to start splitting effort.",
  },
};

export default function NewFlatPage() {
  return <NewFlatForm />;
}
