import { useEffect, useState } from "react";
import {Circle} from "lucide-react";

const HEALTH_URL = "https://localhost:7216/health/ready"; 

export default function DbStatusIcon(){
    const[status, setStatus] = useState<"ok" | "unhealthy" | "loading">("loading");

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch(HEALTH_URL);
                if (!res.ok) return setStatus("unhealthy")
                    const data = await res.json();
                setStatus(data.status === "ok" ? "ok" : "unhealthy");
            } catch {
                setStatus("unhealthy")
            }
        };
        
        check()
        const id = setInterval(check, 10000);
        return () => clearInterval(id);
        }, []);


        const color = 
        status === "ok" ? "text-green-500" :
        status === "loading" ? "text-yellow-500" :
        "text-red-500";

        const text = 
        status === "ok" ? "DB online" :
        status === "loading" ? "Kontrollerar..." : 
        "DB offline"

        return (
            <div className="flex items-center gap-2" title={text}>
                <Circle className= {`${color} ${status === "loading" ? "animate-pulse" : ""}`} />
                <span className="text-xs text muted-foreground hidden sm:inline">{text}</span>
            </div>
        );
}