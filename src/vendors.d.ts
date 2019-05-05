import { BindingHandler, TemplateSource} from "knockout";

interface KnockoutBindingProvider {
    preprocessNode?: (node: HTMLElement) => void;
}
interface KnockoutBindingHandlers {
    koLayout: BindingHandler;
    react: BindingHandler;
}

//interface KnockoutTemplateSources {
//    stringTemplate: new (templateName: string) => KnockoutTemplateSourcesDomElement
//}

//interface KnockoutNativeTemplateEngine {
//    makeTemplateSource: (t: string | HTMLElement, d: Document) => KnockoutTemplateSourcesDomElement;
//}




declare module "text!*" {
    let txt: string;
    export = txt;
}