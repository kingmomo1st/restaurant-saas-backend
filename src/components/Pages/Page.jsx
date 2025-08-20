import PageRenderer from "../components/PageRenderer";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import sanityClient from "../sanity/sanityClient";
import PageRenderer from "../components/PageRenderer";
import Layout from "../components/Layout";

const Page = () => {
  const { slug } = useParams(); // e.g. /page/about
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const query = `*[_type == "page" && slug.current == $slug][0]{
          title,
          sections
        }`;
        const res = await sanityClient.fetch(query, { slug });
        setPageData(res);
      } catch (err) {
        console.error("Error loading page:", err);
      }
    };

    fetchPage();
  }, [slug]);

  if (!pageData) return <div>Loading...</div>;

  return (
    <Layout>
      <h2>{pageData.title}</h2>
      <PageRenderer sections={pageData.sections} />
    </Layout>
  );
};

export default Page;