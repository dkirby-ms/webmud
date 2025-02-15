
import * as React from "react";
import { auth } from "@/auth"

export default async function Home() {
const session = await auth(); 

  return (
    
        <div className="flex">

        </div>
        
  );
}
