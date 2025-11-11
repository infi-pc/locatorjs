use swc_common::FilePathMapping;
use swc_common::{sync::Lrc, SourceMap, DUMMY_SP};
use swc_core::plugin::plugin_transform;
use swc_core::plugin::proxies::TransformPluginProgramMetadata;
use swc_core::{ecma::ast::JSXElement, ecma::transforms::testing::test, ecma::visit::*};
use swc_ecma_ast::*;
use swc_ecma_parser::{Syntax, TsConfig};
use swc_ecma_transforms_base::perf::Parallel;
use swc_ecma_utils::quote_ident;
use swc_ecma_visit::{as_folder, noop_visit_mut_type, Fold, VisitMut};

/// `@babel/plugin-transform-react-jsx-source`
pub fn jsx_src(dev: bool, cm: Lrc<SourceMap>) -> impl Fold + VisitMut {
    as_folder(AddLocatorVisitor { cm, dev })
}

impl Parallel for AddLocatorVisitor {
    fn create(&self) -> Self {
        self.clone()
    }

    fn merge(&mut self, _: Self) {}
}

#[derive(Clone)]
struct AddLocatorVisitor {
    cm: Lrc<SourceMap>,
    dev: bool,
}

impl VisitMut for AddLocatorVisitor {
    noop_visit_mut_type!();

    fn visit_mut_jsx_opening_element(&mut self, e: &mut JSXOpeningElement) {
        if !self.dev || e.span == DUMMY_SP {
            return;
        }

        let loc = self.cm.lookup_char_pos(e.span.lo);
        let file_name = loc.file.name.to_string();

        e.attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr {
            span: DUMMY_SP,
            name: JSXAttrName::Ident(quote_ident!("__source")),
            value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                span: DUMMY_SP,
                expr: JSXExpr::Expr(Box::new(
                    ObjectLit {
                        span: DUMMY_SP,
                        props: vec![
                            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(quote_ident!("fileName")),
                                value: Box::new(Expr::Lit(Lit::Str(Str {
                                    span: DUMMY_SP,
                                    raw: None,
                                    value: file_name.into(),
                                }))),
                            }))),
                            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(quote_ident!("lineNumber")),
                                value: loc.line.into(),
                            }))),
                            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(quote_ident!("columnNumber")),
                                value: (loc.col.0 + 1).into(),
                            }))),
                        ],
                    }
                    .into(),
                )),
            })),
        }));
    }
}

fn tr() -> impl Fold {
    let cm = Lrc::new(SourceMap::new(FilePathMapping::empty()));
    jsx_src(true, cm)
}

test!(
    Syntax::Typescript(TsConfig {
        tsx: true,
        ..Default::default()
    }),
    |_| tr(),
    test_one,
    r#"const x = <div />;"#,
    r#"const x = <div dataLocator="xx:1:5" />;"#
);
