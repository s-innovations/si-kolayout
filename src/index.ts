
import * as ko from "knockout";



export function isDefined(variable: any) {
    return variable !== null && typeof (variable) !== "undefined";
}

export interface KnockoutTemplateBindingHandlerOptions {
    /*
     the ID of an element that contains the template you wish to render - see Note 5 for how to vary this programmatically.
    */
    name?: string;
    /*
    directly pass an array of DOM nodes to use as a template. This should be a non-observable array and note that the elements will be removed from their current parent if they have one. This option is ignored if you have also passed a nonempty value for name.
    */
    nodes?: Array<Node>;
    /*
      an object to supply as the data for the template to render. If you omit this parameter, KO will look for a foreach parameter, or will fall back on using your current model object.
    */
    data?: any;

    /*
    if this parameter is provided, the template will only be rendered if the specified expression evaluates to true (or a true-ish value). This can be useful for preventing a null observable from being bound against a template before it is populated.
    */
    if?: any;
    /*
    instructs KO to render the template in “foreach” mode - see Note 2 for details.
    */
    foreach?: any;

    /*
    when used in conjunction with foreach, defines an alias for each item being rendered - see Note 3 for details.
    */
    as?: string;

    /*
    — callback functions to be invoked against the rendered DOM elements - see Note 4
    */
    afterRender?: (elements: Node[]) => void;
    afterAdd?: (data: any) => void;
    beforeRemove?: (data: any) => void;

}


export interface IKoLayout {
    templateOptions(element?: HTMLElement): KnockoutTemplateBindingHandlerOptions;
}

interface IReactLayout {
    __reactModule?: any;
}

export class KoLayout implements IKoLayout {
    constructor(protected options: KnockoutTemplateBindingHandlerOptions) {
        options.data = options.data || this;
    }

    templateOptions(element?: HTMLElement) {
        return this.options;
    }
}




ko.virtualElements.allowedBindings["koLayout"] = true;

var old = ko.bindingProvider.instance.preprocessNode;
ko.bindingProvider.instance.preprocessNode = function (node: HTMLElement) {

    if (node.nodeType == 8) {    /* Comments looking for <!-- koLayout : propertyname --> */
        var match = node.nodeValue.match(/^\s*koLayout\s*:([\s\S]+)/);

        if (match) {

            var c1 = document.createComment(" ko koLayout: " + match[1]),
                c2 = document.createComment(" /ko ");

            node.parentNode.insertBefore(c1, node);
            node.parentNode.replaceChild(c2, node);


            // Tell Knockout about the new nodes so that it can apply bindings to them
            return [c1, c2];
        }
    }
    if (old) {
        return old.call(this, arguments);
    }

}
interface IDisposable {
    dispose(): void;
}
function canBeDisposed(value: any): value is IDisposable {
    return value && "dispsoe" in value;
}

function strHash(str: string) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

export function createTemplate(nodes: HTMLElement) {
    let tmp = (nodes as HTMLElement).outerHTML;
    let id = strHash(tmp);
    ko["templates"][id] = tmp;
    return id.toString();
}

function isPromiseLayout(layout: IKoLayout | PromiseLike<IKoLayout>) : layout is PromiseLike < IKoLayout > {
    return layout && "then" in layout && typeof layout.then === 'function';
}
ko.bindingHandlers.koLayout = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

        let vm = valueAccessor();
        let layout = ko.utils.unwrapObservable < IKoLayout | PromiseLike<IKoLayout>>(vm);


      

        if (isDefined(layout)) {

            if (isPromiseLayout(layout)) {
                let resolver = ko.observable(false);
                let subscribe = resolver();

                ko.utils.domData.set(element, "kolayout_async", resolver);
                layout.then(k => { resolver(true); })
                return;
            }

            ko.utils.domData.set(element, "kolayout_init", true);
            ko.utils.domData.set(element, "kolayout_model", layout);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                if (canBeDisposed(layout)) {
                    layout.dispose();
                }
            });

            return ko.bindingHandlers.template.init.apply(this, [
                element, layout.templateOptions.bind(layout, element, true), allBindingsAccessor, viewModel, bindingContext
            ]);

        }
    },
    update: async function (element: any, valueAccessor: () => any, allBindingsAccessor?: ko.AllBindings, viewModel?: any, bindingContext?: ko.BindingContext) {

        let vm = valueAccessor();
        let layout = ko.utils.unwrapObservable<IKoLayout | PromiseLike<IKoLayout>>(vm);

        if (isPromiseLayout(layout)) {
            layout = await layout;
        }
      //  var layout = await Promise.resolve(ko.utils.unwrapObservable<IKoLayout>(valueAccessor()));


        if (isDefined(layout)) {

            var oldlayout = ko.utils.domData.get(element, "kolayout_model");
            if (oldlayout && oldlayout !== layout) {
                console.log("new layout");
            }

            let init = !isDefined(ko.utils.domData.get(element, "kolayout_init"));

            if (init) {
                ko.utils.domData.set(element, "kolayout_init", true);
            }


            let options = layout.templateOptions.call(layout, element, init);

            if ("nodes" in options) {
                var tmpstring = options.nodes.map(e => e.outerHTML).join("");
                var id = strHash(tmpstring).toString();
                ko["templates"][id] = tmpstring;

                console.log("changed nodes to template id " + id + " " + options.name);


                options.name = id;

            }


            if (init) {


                ko.utils.domData.set(element, "kolayout_model", layout);
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    if (canBeDisposed(layout)) {
                        layout.dispose();
                    }
                });
                
                ko.bindingHandlers.template.init.apply(this, [
                    element, () => options, allBindingsAccessor, viewModel, bindingContext
                ]);

            }

            return ko.bindingHandlers.template.update.apply(this, [
                element, () => options, allBindingsAccessor, viewModel, bindingContext
            ]);


        } else {
            //Clean out template

            return ko.bindingHandlers.template.update.apply(this, [
                element, function () { return { if: false } }, allBindingsAccessor, viewModel, bindingContext
            ]);
        }
    }
}
