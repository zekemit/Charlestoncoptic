import type { Metadata } from "next";
import Image from "next/image";
import { Container, PageHeader } from "@/components/PageHeader";
import { CrossRule } from "@/components/CrossRule";
import { IMG_ALT, img } from "@/lib/images";
import { CHURCH_MAP_LINK, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "St. Mary and St. George Coptic Orthodox Church of Charleston, SC: our mission, our diocese under His Grace Bishop Peter, and our new church home in Mount Pleasant.",
  alternates: { canonical: "/about-us" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader title="About Us" />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="prose-church">
            <p className="font-display text-2xl leading-snug">
              St. Mary and St. George Coptic Orthodox Church was founded with the intention of creating a place
              for Coptic Christians to devote themselves to the teachings of Jesus Christ, to fellowship, to take
              communion, and to pray. Currently, St. Mary and St. George Coptic Orthodox Church has been renting a
              space at a local Church; however, due to the expanding congregation and in order to accommodate
              future believers, we are acquiring the necessary funding to buy a lot and build a church.
            </p>

            <h2 className="!mt-12">Mission</h2>
            <p>
              St. Mary and St. George Coptic Orthodox Church&rsquo;s main mission is to serve as a place where
              believers can observe the Lord&rsquo;s Supper. It will serve as the main place in and around
              Charleston, South Carolina where believers can come together to remember Christ&rsquo;s death and
              resurrection. The concept of communion carries the idea of gathering together. The Church will
              serve as a place that promotes and teaches prayer.
            </p>
            <p>
              St. Mary and St. George Coptic Orthodox Church will also serve as a location where biblical
              doctrine is taught (Sunday school). We hope, with additional funding, to set up self-contained
              classrooms for children of different ages. The Church will serve as a place of fellowship where
              Christians can be devoted to learning various Biblical doctrine. The Coptic Orthodox Church is
              structured so that Sunday school teachers with the guidance of the appointed priest will oversee
              the educational content. The priest is supervised by Bishop Peter who also has to report back to
              Pope Tawadros II. The main Sunday school teacher oversees other teachers. As soon as a building is
              provided, the diocese will send a priest who will largely oversee these affairs along with the
              founders of the Church, with the supervision of Bishop Peter and approval by Pope Tawadros II.
            </p>
            <p>
              In addition to serving as a convenient place for believers to come together, St. Mary and St. George
              Coptic Orthodox Church plans to engage in certain community development activities. Such activities
              may include, but are not limited to, a clothing/food bank, and after-school and college/graduate
              faith based retreats. We hope that the Church could serve as a place where believers from other
              regions can gather and listen to lectures from priests and bishops on various topics of Biblical
              doctrine.
            </p>
            <p>
              By the grace of God and through your prayers, on June 17, 2025, His Grace Bishop Peter signed the
              purchase of{" "}
              <a href={CHURCH_MAP_LINK} target="_blank" rel="noopener noreferrer">
                2929 Bennett Charles Road, Mount Pleasant, SC 29466
                <span className="sr-only"> (opens map in a new tab)</span>
              </a>{" "}
              to be our new church home.
            </p>
          </div>

          <aside aria-label="Our diocese" className="lg:pt-2">
            <figure className="border border-gilt/70 bg-paper p-5">
              <div className="relative mx-auto aspect-square w-48 overflow-hidden border border-gilt/60">
                <Image
                  src={img.bishopPeter.src}
                  alt={IMG_ALT.bishopPeter}
                  fill
                  sizes="12rem"
                  placeholder="blur"
                  blurDataURL={img.bishopPeter.blurDataURL}
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-5 font-display text-xl leading-snug text-oxblood">
                St. Mary &amp; St. George Coptic Orthodox Church belongs to the Diocese of North Carolina, South
                Carolina, &amp; Kentucky under the supervision and guidance of His Grace Bishop Peter.
              </figcaption>
            </figure>
          </aside>
        </div>

        <CrossRule className="my-14 max-w-md" />

        <section aria-labelledby="ack-heading" className="prose-church">
          <h2 id="ack-heading">Acknowledgements</h2>
          <p>
            <a href={SITE.frFatherUrl} target="_blank" rel="noopener noreferrer">
              Fr Antony Zaki<span className="sr-only"> (opens his page on St. Mark&rsquo;s website in a new tab)</span>
            </a>{" "}
            continues to bless us with his relentless service to fulfill the needs of our growing congregation. He
            is aided by Fr. Joseph Tawfik from Archangel Michael Church in Greenville SC as well as several other
            priests in the area.
          </p>
          <p>
            His Grace Archilids El-Antony (formerly Fr. Archilids) served us for two years and we congratulate him
            on his ordination as an Auxiliary Bishop for Toronto, Canada.
          </p>
          <p>
            There are no words to express our appreciation and thanks to H. G. Bishop Peter for continuing to
            support our church.
          </p>
          <p className="font-display text-2xl italic">
            May God bless them all and keep them all for us for many years to come.
          </p>
        </section>
      </Container>
    </>
  );
}
