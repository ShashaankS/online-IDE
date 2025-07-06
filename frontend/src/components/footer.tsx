import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, FileText, Info } from "lucide-react"

export default function Footer() {
    return(
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-12 items-center justify-center space-x-6">
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Documentation</span>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <Info className="h-4 w-4" />
                <span>About</span>
            </Button>
            </div>
        </footer>
    );
}