"use client";

import React from "react";
import { LoginForm, RegisterForm } from "./forms";

export const Singup = () => {
  const [formState, setFormState] = React.useState<string>("login");

  return ["login"].includes(formState) ? (
    <LoginForm setFormState={setFormState} />
  ) : (
    <RegisterForm setFormState={setFormState}/>
  );
};
