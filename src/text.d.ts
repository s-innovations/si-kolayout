declare module "text" {
    interface text {
        load(name: string, req: any, onLoad: any, config: any): void;
        write(pluginName: string, moduleName: string, write: any, config: any): void;
    }
    let a: text;
    export = a;
}