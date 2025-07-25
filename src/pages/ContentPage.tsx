import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PaymentButton from '../components/PaymentButton';

interface CourseData {
  id: string;
  title: string;
  priceId: string;
  priceLabel: string;
}

export default function ContentPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseData | null>(null);
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/content/${courseId}`)
      .then(r => r.json())
      .then((data: CourseData) => setCourse(data))
      .catch(console.error);
  }, [courseId]);

  if (!course) return <p>Loading…</p>;

  const inCart = items.some(i => i.courseId === course.id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{course.title}</h1>

      {!inCart ? (
        <button
          onClick={() =>
            addItem({
              courseId: course.id,
              title: course.title,
              priceId: course.priceId,
              priceLabel: course.priceLabel,
            })
          }
          className="bg-bjj-blue text-white px-4 py-2 rounded"
        >
          Add to Cart ({course.priceLabel})
        </button>
      ) : (
        <button
          onClick={() => navigate('/cart')}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Go to Cart
        </button>
      )}

      {/* If you want a “Buy Now” directly from the content page */}
      <div className="mt-4">
        <PaymentButton courseId={course.id} priceId={course.priceId} />
      </div>
    </div>
  );
}
