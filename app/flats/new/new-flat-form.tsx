"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFlatAction } from "./actions";

export function NewFlatForm() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [emails, setEmails] = useState(["", ""]);

  const cleanEmails = emails.map((email) => email.trim()).filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:gap-8">
      <Card className="bg-blue-400">
        <CardHeader className="gap-2">
          <Badge className="w-fit bg-white text-xs font-bold uppercase">New group</Badge>
          <CardTitle className="text-3xl sm:text-4xl md:text-5xl">Create a flat</CardTitle>
          <CardDescription className="max-w-2xl text-base font-bold text-foreground/80 md:text-lg">
            Name the place, add the people. Everyone starts at 0 effort points — the board keeps
            it honest from there.
          </CardDescription>
        </CardHeader>
      </Card>

      <form action={createFlatAction} className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="flat-name" className="text-xs uppercase">
                  Flat name
                </Label>
                <Input
                  id="flat-name"
                  name="name"
                  placeholder="Flat 3B, Kirkgate"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="flat-location" className="text-xs uppercase">
                  City / area
                </Label>
                <Input
                  id="flat-location"
                  name="city"
                  placeholder="Leeds"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-lime-300">
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="text-xs uppercase">Invite by email</Label>
                <Button
                  type="button"
                  variant="noShadow"
                  size="sm"
                  className="bg-white uppercase hover:bg-amber-300"
                  onClick={() => setEmails((prev) => [...prev, ""])}
                >
                  + Add person
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {emails.map((email, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      className="bg-white"
                      name="email"
                      type="email"
                      placeholder="housemate@example.com"
                      value={email}
                      onChange={(e) =>
                        setEmails((prev) =>
                          prev.map((value, idx) => (idx === i ? e.target.value : value)),
                        )
                      }
                    />
                    {emails.length > 1 && (
                      <Button
                        type="button"
                        variant="noShadow"
                        size="icon"
                        className="shrink-0 bg-red-400"
                        aria-label={`Remove person ${i + 1}`}
                        onClick={() =>
                          setEmails((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-red-400 text-md font-bold uppercase">
            Create flat
          </Button>
        </div>

        <Card className="h-fit bg-amber-300">
          <CardContent className="flex flex-col gap-2">
            <Badge className="w-fit bg-white text-xs font-bold uppercase">Preview</Badge>
            <h2 className="mt-2 text-2xl sm:text-3xl">{name.trim() || "Untitled flat"}</h2>
            <p className="text-sm font-bold uppercase text-foreground/80">
              {city.trim() || "No location yet"}
            </p>

            <p className="mt-4 text-xs font-bold uppercase text-foreground/80">
              {cleanEmails.length} member{cleanEmails.length === 1 ? "" : "s"}
            </p>
            {cleanEmails.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {cleanEmails.map((email) => (
                  <li
                    key={email}
                    className="border-2 border-border bg-white px-3 py-2 text-sm font-bold break-all"
                  >
                    {email}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-bold">Add at least one email to create the flat.</p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
