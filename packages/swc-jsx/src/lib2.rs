use swc_core::{
    common::Spanned,
    ecma::ast::*,
    ecma::visit::{as_folder, Fold, FoldWith},
};

struct JSXVisitor {
    filename: String,
}

impl Fold for JSXVisitor {
    fn fold_jsx_element(&mut self, mut el: JSXElement) -> JSXElement {
        let span = el.span;
        let loc = self.filename.clone()
            + ":"
            + &span.line.to_string()
            + ":"
            + &span.col_start.to_string();

        el.opening.attrs.push(JSXAttr {
            span,
            name: JSXAttrName::Ident(Ident::new("data-locator".into(), span)),
            value: Some(JSXAttrValue::Lit(Str {
                span,
                value: loc,
                has_escape: false,
                kind: Default::default(),
            })),
        });

        el
    }
}

pub fn process(program: Program, filename: String) -> Program {
    program.fold_with(&mut as_folder(JSXVisitor { filename }))
}
