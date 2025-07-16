// Export the ProductsPage component
import ProductsPageComponent from './ProductsPage';

// Export with props interface
interface ProductsPageProps {
  initialTab?: string;
}

const ProductsPage = (props: ProductsPageProps = {}) => {
  return <ProductsPageComponent {...props} />;
};

export default ProductsPage;