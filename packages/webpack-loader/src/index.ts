import type { LoaderContext } from 'webpack';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import MagicString from 'magic-string';
import { validate } from 'schema-utils';

interface LoaderOptions {
  enabled?: boolean;
  production?: boolean;
  excludeTags?: string[];
}

const schema = {
  type: 'object' as const,
  properties: {
    enabled: {
      type: 'boolean',
    },
    production: {
      type: 'boolean',
    },
    excludeTags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  additionalProperties: false,
};

function shouldAddAttribute(
  elementName: string,
  options: LoaderOptions
): boolean {
  // Skip if disabled in production
  if (options.production) {
    return false;
  }

  // Skip if disabled
  if (options.enabled === false) {
    return false;
  }

  // Skip excluded tags
  if (options.excludeTags?.includes(elementName)) {
    return false;
  }

  // Skip Fragment and other special React elements
  if (
    elementName === 'Fragment' ||
    elementName === 'React.Fragment' ||
    elementName.startsWith('_') ||
    !elementName
  ) {
    return false;
  }

  return true;
}

function transformJSX(
  source: string,
  filePath: string,
  options: LoaderOptions
): string {
  // Skip transformation if disabled
  if (options.enabled === false || options.production) {
    return source;
  }

  const magicString = new MagicString(source);
  
  try {
    const ast = parse(source, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        ['decorators', { decoratorsBeforeExport: true }],
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
        'logicalAssignment',
      ],
    });

    traverse(ast, {
      JSXOpeningElement(path) {
        const node = path.node;
        
        // Get element name
        let elementName = '';
        if (node.name.type === 'JSXIdentifier') {
          elementName = node.name.name;
        } else if (node.name.type === 'JSXMemberExpression') {
          // For member expressions like Foo.Bar
          const property = node.name.property;
          if (property.type === 'JSXIdentifier') {
            elementName = property.name;
          }
        }

        // Check if we should add the attribute
        if (!shouldAddAttribute(elementName, options)) {
          return;
        }

        // Check if data-source already exists
        const hasDataSource = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'data-source'
        );

        if (hasDataSource) {
          return;
        }

        // Calculate position to insert attribute
        const line = node.loc?.start.line || 0;
        const column = node.loc?.start.column || 0;
        
        // Create data-source value
        const dataSourceValue = `${filePath}:${line}:${column + 1}`;
        
        // Find insertion position (before closing > or />)
        const insertPos = node.selfClosing
          ? node.end! - 2 // Before />
          : node.end! - 1; // Before >
        
        // Insert the attribute
        magicString.appendLeft(insertPos, ` data-source="${dataSourceValue}"`);
      },
    });

    return magicString.toString();
  } catch (error) {
    // If parsing fails, return original source
    console.warn(`Failed to transform ${filePath}:`, error);
    return source;
  }
}

export default function locatorLoader(
  this: LoaderContext<LoaderOptions>,
  source: string
): string {
  const options = this.getOptions() || {};
  
  // Validate options
  validate(schema, options, {
    name: 'LocatorJS Webpack Loader',
    baseDataPath: 'options',
  });

  // Get file path relative to project root
  const filePath = this.resourcePath;
  
  // Skip node_modules and middleware files
  if (filePath.includes('node_modules') || filePath.includes('middleware.')) {
    return source;
  }
  
  // Transform the source
  const transformed = transformJSX(source, filePath, options);
  
  return transformed;
}

// Also export a pitch function for potential future use
export function pitch(
  this: LoaderContext<LoaderOptions>,
  remainingRequest: string
): void {
  // Can be used for pre-processing if needed
}